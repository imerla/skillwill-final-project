import { BrowserRouter, Routes, Route } from 'react-router-dom'

function LoginPage() {
  return <div>Login Page</div>
}

function RegisterPage() {
  return <div>Register Page</div>
}

function ForgotPasswordPage() {
  return <div>Forgot Password Page</div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
