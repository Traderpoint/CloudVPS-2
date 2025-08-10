import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  const handleGoogleSuccess = async (response) => {
    try {
      const token = response.credential;
      localStorage.setItem('token', token);
      setIsLoggedIn(true);
      router.push('/success');
    } catch (error) {
      router.push('/error');
    }
  };

  const handleGoogleFailure = () => {
    router.push('/error');
  };

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setIsLoggedIn(true);
      router.push('/success');
    } catch (error) {
      router.push('/error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="absolute top-4 right-4">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="text-purple-600 hover:underline">Odhlásit</button>
        ) : (
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleFailure} />
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-between mb-4">
          <a href="#" className="text-purple-600 hover:underline">&larr; Back</a>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        <div className="flex justify-center mb-4 space-x-2">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleFailure} />
          <span className="my-auto">or</span>
          <button className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">GitHub</button>
        </div>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700">Register</button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          Already have an account? <a href="#" className="text-purple-600 hover:underline">Log in</a>
        </p>
        <p className="text-center mt-2 text-sm text-gray-500">
          By continuing you agree with our Terms of Service and confirm that you have read our Privacy Policy
        </p>
      </div>
    </div>
  );
}