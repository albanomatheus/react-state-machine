import { useMachine } from "@xstate/react";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";
import { Machine, assign } from "xstate";
import "./App.css";

const foo = {
  email: "foo",
  password: "foo123"
};

function userLogin(user) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      user.email === foo.email && user.password === foo.password
        ? resolve(`Welcome ${user.username}`)
        : reject("Username or password invalid!");
    }, 2000);
  });
}

const stateMachine = Machine({
  initial: "initial",
  context: {
    email: "",
    password: "",
    msg: ""
  },
  states: {
    initial: {
      on: {
        SUBMIT: [
          {
            target: "loading",
            cond: (ctx, event) => {
              return event.data.email !== "" && event.data.password !== "";
            }
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
          actions: assign({ msg: (ctx, event) => event.data })
        },
        onError: {
          target: "error",
          actions: assign({ msg: (ctx, event) => event.data })
        }
      }
    },
    error: {
      on: {
        SUBMIT: {
          target: "loading",
          cond: (ctx, event) => {
            return event.data.email !== "" && event.data.password !== "";
          }
        }
      }
    },
    logged: {
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
  return props.machine.matches("error") ? (
    <div className="alert error">
      {props.machine.context.msg ? props.machine.context.msg : "Oh no! No error message."}
    </div>
  ) : null;
};

const App = () => {
  const [machine, send] = useMachine(stateMachine);

  return (
    <div style={{ margin: "130px auto", width: "800px" }}>
      <MicroFlow machine={machine} />
      <ErrorMessage machine={machine} />
      <Form send={send} />
    </div>
  );
};

const MicroFlowState = props => {
  return (
    <button
      className={`state btn ${props.machine.value === props.name ? "btn-danger" : "btn-primary"}`}
      onClick={() => props.onClick(props.machine)}
    >
      {props.name}
    </button>
  );
};

const MicroFlow = props => {
  const showContext = state => {
    console.log(state.context);
  };

  const states = Object.keys(stateMachine.states).map(state => {
    return (
      <MicroFlowState name={state} key={state} machine={props.machine} onClick={showContext} />
    );
  });

  return <div style={{ textAlign: "center" }}>{states}</div>;
};

export default App;
