import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import { API_URL } from '../../config';

const Register = ({ history }) => {
  const { state, dispatch } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { username, email, password, confirmPassword } = formData;

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

    // Validar senha
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password
      });

      dispatch({
        type: 'REGISTER_SUCCESS',
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
          : 'Erro ao registrar. Verifique seus dados.'
      );

      dispatch({
        type: 'REGISTER_FAIL',
        payload: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Registro</h1>
      <p>Crie sua conta para gerenciar suas sessões do WhatsApp</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="username">Nome de Usuário</label>
          <input
            type="text"
            name="username"
            id="username"
            value={username}
            onChange={onChange}
            required
          />
        </div>
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
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Senha</label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            value={confirmPassword}
            onChange={onChange}
            required
            minLength="6"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
      
      <p className="mt-3">
        Já tem uma conta? <Link to="/login">Faça login</Link>
      </p>
    </div>
  );
};

export default Register;
