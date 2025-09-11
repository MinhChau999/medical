import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { authAPI } from '@/services/api'
import { loginStart, loginSuccess, loginFailure } from '@/stores/slices/authSlice'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    dispatch(loginStart())
    
    try {
      const response = await authAPI.login(values)
      dispatch(loginSuccess(response as any))
      message.success('Login successful!')
      
      // Redirect based on role
      const userRole = (response as any).user.role
      if (userRole === 'admin' || userRole === 'manager') {
        navigate('/admin')
      } else if (userRole === 'staff') {
        navigate('/pos')
      } else {
        navigate('/shop')
      }
    } catch (error: any) {
      dispatch(loginFailure())
      message.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              Sign in
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}