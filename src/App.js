import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect } from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import "./App.css";

const user = {
  email: "matheus",
  password: "matheus123"
};

function userLogin(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      data.email === user.email && data.password === user.password
        ? resolve(`Welcome ${data.email}`)
        : reject("Username or password invalid!");
    }, 2000);
  });
}

const Form = props => {
  const [form, updateForm] = useState({
    email: "",
    password: ""
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        props.send({ type: "SUBMIT", data: { ...form } });
      }}
    >
      <div className="form-group">
        <label>Email</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter email"
          value={form.email}
          onChange={e => updateForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Password"
          value={form.password}
          onChange={e => updateForm({ ...form, password: e.target.value })}
        />
      </div>
      <button type="submit" className="form-control btn btn-success">
        Submit
      </button>
    </form>
  );
};

const ErrorMessage = props => {
  return (
    <div className="alert error">
      {props.state.context.msg ? props.state.context.msg : "Oh no! No error message."}
    </div>
  );
};

const MicroFlowState = props => {
  return (
    <div
      className={`state btn ${props.machine.value === props.name ? "btn-danger" : "btn-primary"}`}
    >
      <p>{props.name}</p>
      <input
        type="checkbox"
        onChange={e => props.onClick(e, props.name)}
        defaultChecked={props.statesChecked.find(name => name === props.name)}
      />
    </div>
  );
};

const MicroFlow = props => {
  const setCheckPoint = (e, stateName) => {
    if (e.target.checked) {
      props.setStatesChecked(props.statesChecked.concat(stateName));
      console.log(props.statesChecked.concat(stateName));
    } else {
      props.setStatesChecked(
        props.statesChecked.filter(checkPoints => {
          return checkPoints !== stateName;
        })
      );
    }
  };

  const states = Object.keys(props.machine.states).map(state => {
    return (
      <MicroFlowState
        key={state}
        name={state}
        machine={props.state}
        onClick={setCheckPoint}
        statesChecked={props.statesChecked}
      />
    );
  });

  return <div style={{ textAlign: "center" }}>{states}</div>;
};

const StateHistory = props => {
  return (
    <div style={{ marginRight: "100px" }}>
      {props.stateHistory.map((log, index) => (
        <div key={index}>{JSON.stringify(log)}</div>
      ))}
    </div>
  );
};

const App = () => {
  const stateMachine = Machine({
    initial: "initial",
    context: {
      msg: "",
      debbugVariables: {
        email: "",
        password: ""
      }
    },
    states: {
      initial: {
        on: {
          SUBMIT: [
            {
              target: "loading",
              cond: (ctx, event) => event.data.email !== "" && event.data.password !== "",
              actions: assign({
                debbugVariables: (ctx, event) => event.data
              })
            },
            {
              target: "error",
              actions: assign({
                msg: (ctx, event) => "User and password can not be empty!"
              })
            }
          ]
        }
      },
      loading: {
        invoke: {
          id: "login",
          src: (ctx, event) => userLogin({ ...event.data }),
          onDone: {
            target: "logged",
            actions: assign({
              msg: (ctx, event) => event.data
            })
          },
          onError: {
            target: "error",
            actions: assign({
              msg: (ctx, event) => event.data
            })
          }
        }
      },
      error: {
        on: {
          SUBMIT: {
            target: "loading",
            cond: (ctx, event) => {
              return event.data.email !== "" && event.data.password !== "";
            },
            actions: assign({
              msg: (ctx, event) => event.data,
              debbugVariables: (ctx, event) => event.data
            })
          }
        }
      },
      logged: {
        type: "final"
      }
    }
  });

  const [state, send] = useMachine(stateMachine);
  const [stateHistory, setStateHistory] = useState([]);
  const [statesChecked, setStatesChecked] = useState(["initial"]);

  useEffect(() => {
    if (statesChecked.find(checkPoints => checkPoints === state.value)) {
      setStateHistory(
        stateHistory.concat({ state: state.value, ...state.context.debbugVariables })
      );
    }
  }, [state]);

  return (
    <div style={{ margin: "130px auto", width: "800px" }}>
      <MicroFlow
        machine={stateMachine}
        state={state}
        statesChecked={statesChecked}
        setStatesChecked={setStatesChecked}
      />
      {state.matches("error") || state.matches("logged") ? <ErrorMessage state={state} /> : null}
      {!state.matches("logged") ? <Form send={send} /> : null}
      <StateHistory stateHistory={stateHistory} />
    </div>
  );
};

export default App;
