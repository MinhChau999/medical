import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Checkbox } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';

const { Title, Text, Link } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const [rememberMe, setRememberMe] = useState(false);

  // Auto-fill test credentials
  useEffect(() => {
    form.setFieldsValue({
      email: 'admin@medical.com',
      password: 'password123'
    });
  }, [form]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', values.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }
      
      message.success(t('loginSuccessful'));
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || t('loginFailed'));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode ? '#0f0f0f' : '#ffffff',
        padding: '40px',
        position: 'relative',
        zIndex: 2,
      }}>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.2, 
              duration: 0.8,
              type: 'spring',
              stiffness: 260,
              damping: 20 
            }}
            style={{ marginBottom: 40 }}
          >
            <div style={{
              width: 70,
              height: 70,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #00A6B8 0%, #0088A0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#fff',
              boxShadow: '0 20px 40px rgba(0, 166, 184, 0.3)',
              transform: 'rotate(10deg)',
            }}>
              M
            </div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ marginBottom: 40 }}
          >
            <Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>
              Welcome back!
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Medical Electronics Admin System
            </Text>
          </motion.div>

          {/* Login Form */}
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: t('emailRequired') },
                { type: 'email', message: t('emailInvalid') },
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#999' }} />}
                placeholder="Email address"
                style={{
                  borderRadius: 12,
                  height: 50,
                  fontSize: 15,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>Password</span>}
              name="password"
              rules={[
                { required: true, message: t('passwordRequired') },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
              style={{ marginBottom: 20 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="Password"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                style={{
                  borderRadius: 12,
                  height: 50,
                  fontSize: 15,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ fontSize: 14 }}
                >
                  Remember me
                </Checkbox>
                <Link href="#" style={{ 
                  color: '#00A6B8',
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  Forgot password?
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                block
                icon={<LoginOutlined style={{ color: '#FFFFFF' }} />}
                style={{
                  height: 50,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #00A6B8 0%, #0088A0 100%)',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: '0 10px 30px rgba(0, 166, 184, 0.3)',
                  color: '#FFFFFF',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                }}
                className="login-btn"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Test Credentials Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ 
              marginTop: 24,
              padding: 16,
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(0, 166, 184, 0.1) 0%, rgba(0, 136, 160, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(0, 166, 184, 0.08) 0%, rgba(0, 136, 160, 0.03) 100%)',
              borderRadius: 12,
              border: '1px solid ' + (isDarkMode ? 'rgba(0, 166, 184, 0.2)' : 'rgba(0, 166, 184, 0.15)'),
            }}
          >
            <Text strong style={{ fontSize: 12, color: '#00A6B8' }}>
              TEST CREDENTIALS (Already filled)
            </Text>
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: isDarkMode ? '#ccc' : '#666' }}>
                Email: admin@medical.com<br/>
                Password: password123
              </Text>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Panel - Decorative */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #00A6B8 0%, #0088A0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated Background Shapes */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-20%',
            right: '-20%',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%',
            background: 'rgba(255, 255, 255, 0.08)',
            bottom: '-10%',
            left: '-10%',
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            textAlign: 'center',
            color: '#fff',
            padding: 40,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Title level={1} style={{ 
            color: '#fff', 
            marginBottom: 24,
            fontSize: 42,
            fontWeight: 700,
          }}>
            Medical Electronics
          </Title>
          <Text style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 18,
            lineHeight: 1.6,
          }}>
            Advanced Healthcare Management System
            <br />
            Streamline your medical operations with our
            <br />
            comprehensive dashboard solution
          </Text>

          {/* Feature Icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{
              marginTop: 60,
              display: 'flex',
              justifyContent: 'center',
              gap: 40,
            }}
          >
            {[
              { icon: '📊', label: 'Analytics' },
              { icon: '💊', label: 'Medical' },
              { icon: '⚡', label: 'Fast' },
              { icon: '🔒', label: 'Secure' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                style={{
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontSize: 32,
                  marginBottom: 8,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                }}>
                  {item.icon}
                </div>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {item.label}
                </Text>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Responsive Message */}
      <style>{`
        @media (max-width: 768px) {
          .login-container > div:last-child {
            display: none;
          }
        }
        
        .login-btn {
          transition: all 0.3s ease !important;
        }
        
        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(0, 166, 184, 0.5) !important;
          background: linear-gradient(135deg, #00B8CC 0%, #009AB0 100%) !important;
          filter: brightness(1.1);
        }
        
        .login-btn:active {
          transform: translateY(0);
        }
        
        .login-btn span {
          color: #FFFFFF !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px;
        }
        
        .ant-btn-loading-icon {
          color: #FFFFFF !important;
        }
      `}</style>
    </div>
  );
};

export default Login;