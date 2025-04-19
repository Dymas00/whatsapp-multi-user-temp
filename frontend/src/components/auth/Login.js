import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import { API_URL } from '../../config';

const Login = ({ history }) => {
  const { state, dispatch } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { email, password } = formData;

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (state.token) {
      history.push('/dashboard');
    }
  }, [state.token, history]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });

      // Carregar dados do usuário
      const userRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${res.data.token}`
        }
      });

      dispatch({
        type: 'USER_LOADED',
        payload: userRes.data.user
      });

      history.push('/dashboard');
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao fazer login. Verifique suas credenciais.'
      );

      dispatch({
        type: 'LOGIN_FAIL',
        payload: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <p>Acesse sua conta para gerenciar suas sessões do WhatsApp</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            name="password"
            id="password"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      <p className="mt-3">
        Não tem uma conta? <Link to="/register">Registre-se</Link>
      </p>
    </div>
  );
};

export default Login;
