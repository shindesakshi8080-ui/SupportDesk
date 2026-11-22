function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <h1>SupportDesk</h1>
          <p>Sign in to your account</p>
        </div>

        <form className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        <p className="login-footer">
          Secure SupportDesk Access
        </p>
      </section>
    </main>
  )
}

export default LoginPage