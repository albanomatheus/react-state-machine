import { useMachine } from "@xstate/react";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect } from "react";
import { Machine, assign } from "xstate";
import "./App.css";

const user = {
  email: "matheus",
  password: "matheus123"
};

let stateHistory = [];
let statesChecked = ["initial"];

function saveContext(state, ctx) {
  console.log(ctx);
  if (statesChecked.find(checkPoints => checkPoints === state)) {
    stateHistory.push({ state: state, ...ctx });
  }
}

function userLogin(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      data.email === user.email && data.password === user.password
        ? resolve(`Welcome ${data.email}`)
        : reject("Username or password invalid!");
    }, 2000);
  });
}

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
      entry: (ctx, event) => saveContext("initial", ctx.debbugVariables),
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
      entry: (ctx, event) => saveContext("loading", ctx.debbugVariables),
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
      entry: (ctx, event) => saveContext("error", ctx.debbugVariables),
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
      entry: (ctx, event) => saveContext("logged", ctx.debbugVariables),
      type: "final"
    }
  }
});

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
      {props.machine.context.msg ? props.machine.context.msg : "Oh no! No error message."}
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
        defaultChecked={statesChecked.find(name => name === props.name)}
      />
    </div>
  );
};

const MicroFlow = props => {
  const setCheckPoint = (e, stateName) => {
    if (e.target.checked) {
      statesChecked.push(stateName);
    } else {
      statesChecked = statesChecked.filter(checkPoints => {
        return checkPoints !== stateName;
      });
    }
  };

  const states = Object.keys(stateMachine.states).map(state => {
    return (
      <MicroFlowState name={state} key={state} machine={props.machine} onClick={setCheckPoint} />
    );
  });

  return <div style={{ textAlign: "center" }}>{states}</div>;
};

const StateHistory = props => {
  return (
    <div style={{ marginRight: "100px" }}>
      {stateHistory.map((log, index) => (
        <div key={index}>{JSON.stringify(log)}</div>
      ))}
    </div>
  );
};

const App = () => {
  const [machine, send] = useMachine(stateMachine);

  return (
    <div style={{ margin: "130px auto", width: "800px" }}>
      <MicroFlow machine={machine} />
      {machine.matches("error") || machine.matches("logged") ? (
        <ErrorMessage machine={machine} />
      ) : null}
      {!machine.matches("logged") ? <Form send={send} /> : null}
      <StateHistory />
    </div>
  );
};

export default App;
