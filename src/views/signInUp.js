import React, { useState, useMemo } from 'react';

import { Form, Input, Button, Row, message } from 'antd';
import { Tabs } from 'antd';

import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

import { useAuth } from "../hooks/useAuth.js";

import "./signInUp.css";

import config from '../config'

const { TabPane } = Tabs;


export default function SignInUp() {

  const [action, actionSetState] = useState('signIn');

  const { switchToSignIn, switchToSignUp, switchToForgot } = useMemo(() => {
    return {
      switchToSignIn: () => { actionSetState('signIn') },
      switchToSignUp: () => { actionSetState('signUp') },
      switchToForgot: () => { actionSetState('forgot') },
    }
  }, [actionSetState])

  return <Row justify="space-around" align="middle" style={{ height: "inherit" }}>
    <Tabs className="form-tabs"
      defaultActiveKey={action} activeKey={action} onTabClick={(key) => { actionSetState(key); }}>
      <TabPane tab="登录" key="signIn">
        <FormSignIn switchToRegister={switchToSignUp} switchToForgot={switchToForgot} />
      </TabPane>
      <TabPane tab="注册" key="signUp">
        <FormSignUp switchToLogin={switchToSignIn} switchToForgot={switchToForgot} />
      </TabPane>
      <TabPane tab="" key="forgot">
        <FormForgot switchToLogin={switchToSignIn} />
      </TabPane>

    </Tabs>
  </Row>;




}

function FormSignIn({ switchToRegister, switchToForgot }) {
  const auth = useAuth();

  const onFinish = ({ email, password }) => {
    //console.log('Received values of form: ', values);
    auth.signin(email, password)
    .then(isOK => { if (isOK) message.info("登录成功") })
    .catch(error => message.error(error.message));
  };

  return (
    <Form
      name="normal_login"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      size={'large'}
    >

      <Form.Item
        name='email'
        rules={[{
          type: 'email',
          message: 'The input is not valid E-mail!',
        }, {
          required: true,
          message: 'Please input your email!',
        }]}>
        <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Email" />
      </Form.Item>

      <Form.Item
        name='password'
        rules={[{
          required: true,
          message: 'Please input your Password!',
        }]}>
        <Input prefix={<LockOutlined className="site-form-item-icon" />}
          type="password"
          placeholder="Password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" className="form-button">
          Log in
        </Button>
        <Button type="link" className="login-form-forgot"
          onClick={(event) => { switchToForgot(); event.preventDefault(); }}>
          Forgot password? </Button>

      </Form.Item>
    </Form>
  );
};


function FormSignUp({ switchToLogin, switchToForgot }) {
  const auth = useAuth();

  const onFinish = ({ username, email, password }) => {
    //console.log('Received values of form: ', values);


    //先获取 recaptcha token
    window.grecaptcha && window.grecaptcha.ready(() => {
      window.grecaptcha.execute(config.recapcha.site_key, { action: 'SignUp' }).then(token => {

        auth.signup(username, email, password, token)
        .then(isOK => { if (isOK) message.info("注册成功") })
        .catch(error => message.error(error.message));;

      });
    });





  };

  return (
    <Form
      name="normal_register"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      size={'large'}
    >

      <Form.Item
        name="username"
        rules={[
          {
            required: false,
            message: 'Please input your usename!',
          },
        ]}
      >
        <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="User name" />
      </Form.Item>


      <Form.Item
        name="email"
        rules={[
          {
            type: 'email',
            message: 'The input is not valid E-mail!',
          },
          {
            required: true,
            message: 'Please input your email!',
          },
        ]}
      >
        <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
        hasFeedback
      >
        <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} />
      </Form.Item>

      <Form.Item
        name="confirm"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please confirm your password!',
          },
          ({ getFieldValue }) => ({
            validator(rule, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject('The two passwords that you entered do not match!');
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} />
      </Form.Item>


      <Form.Item>
        <Button type="primary" htmlType="submit" className="form-button">
          Register
        </Button>
        Or <Button type="link" onClick={(event) => { switchToLogin(); event.preventDefault(); }}>login now!</Button>
      </Form.Item>
    </Form>
  );
};


function FormForgot({ switchToLogin }) {
  const auth = useAuth();

  const onFinish = ({ email }) => {
    //    console.log('Received values of form: ', values);
    auth.sendPasswordResetEmail(email)
      .then(isOK => message.info("发送成功"))
      .catch(error => message.error(error.message));;

  };

  const [timeCnt, setTimeCnt] = useState(-1);

  const cntDown = () => {
    setTimeout(() => {
      setTimeCnt(cnt => {
        if (cnt > 0) cntDown();
        return cnt - 1;
      });
    }, 1000);
  }

  const startTimer = (initCnt) => {
    setTimeCnt(initCnt);
    cntDown();
  }

  return (
    <Form
      name="normal_register"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      size={'large'}
    >
      <Form.Item
        name="email"
        rules={[
          {
            type: 'email',
            message: 'The input is not valid E-mail!',
          },
          {
            required: true,
            message: 'Please input your email!',
          },
        ]}
      >
        <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Email" />
      </Form.Item>



      <Form.Item>
        <Button type="primary" htmlType="submit" className="form-button"
          disabled={timeCnt >= 0}
          onClick={() => startTimer(60)}>
          {timeCnt >= 0 ? `wait ${timeCnt}s` : 'Send reset email'}
        </Button>
        Or <Button type="link" onClick={(event) => { switchToLogin(); event.preventDefault(); }}>login now!</Button>
      </Form.Item>
    </Form>
  );
};

