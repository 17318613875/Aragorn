import { $axios, BASE_URL } from '@renderer/app';
import { Button, Divider, Input, Form, Checkbox, Spin, message } from 'antd';
import {
  AxiosInstance,
  AxiosError,
  AxiosResponse
} from 'axios';
import { pick } from 'lodash';
import { Get } from 'react-axios'

export const Login = () => {

  const onFinish = (form: any) => {
    console.log('Success:', form);
    const code = '12'
    $axios.post(`/api/auth/login/${form.code}/${code}`, pick(form, ['username', 'password'])).then(() => {
      message.success('登录成功');
      // router.push('/');
    });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const codeUrl = `/api/auth/code`
  const suffix = <>
    <Get url={codeUrl}>
      {(error: AxiosError, response: AxiosResponse, isLoading: boolean, makeRequest, axios: AxiosInstance) => {
        if (error) {
          return <span>{{ error }}</span>
        } else if (isLoading) {
          return <Spin />
        } else if (response !== null && response.data && typeof response.data === 'string') {
          return <img src={`${BASE_URL}${codeUrl}`} alt="" style={{ height: '22px' }} />
        } else {
          return <div>Default message before request is made.</div>
        }
      }}
    </Get>
  </>

  return (
    <div className="info-wrapper">
      <header>
        <div className="text-center">登录</div>
        <Divider />
      </header>
      <main>
        <Form
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          style={{ width: '380px' }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="验证码"
            name="code"
            rules={[{ required: true, message: '请输入验证码!' }]}
          >
            <Input placeholder="请输入验证码" suffix={suffix} />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
      </main>
    </div>
  );
};
