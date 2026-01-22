import React, {useState} from 'react'
import { useNavigate, Link } from 'react-router-dom';
import { UserApi } from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        loading: false,
        error: ""
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setData({
            ...data,
            [name]: value,
            error: ""
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!data.name || !data.email || !data.password){
            setData({
                ...data,
                error: "Please fill in all fields"
            })
            return;
        }
        if(data.password.length < 6){
            setData({
                ...data,
                error: "Password must be at least 6 characters long"
            })
            return;
        }
        if(!emailRegex.test(data.email)){
            setData({
                ...data,
                error: "Invalid email format"
            })
            return;
        }
        setData({
            ...data,
            loading: true
        })
        try {
            // console.log("Sending registration request...", {
            //     name: data.name,
            //     email: data.email,
            //     password: data.password,
            //     role: data.role
            // });
            
            const response = await UserApi.register({
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role
            });
            
            // console.log("Registration response:", response);
            
            if(response.status === 201 || response.status === 200){
                // Store user info and tokens in AuthContext
                login(
                    response.data.UserData,
                    {
                        accessToken: response.data.AccessToken,
                        refreshToken: response.data.RefreshToken,
                    },
                    false // Don't remember by default on registration
                );
                // Redirect to dashboard after successful registration
                navigate("/dashboard");
            } else {
                const errorMessage = 
                    response.data?.message || 
                    "Registration failed. Please try again.";
                setData({
                    ...data,
                    error: errorMessage,
                    loading: false
                })
                return;
            }
        } catch (error) {
            console.error("Registration error:", error);
            const errorMessage = 
                error.response?.data?.message || 
                error.response?.data?.error ||
                error.message ||
                "An error occurred during registration. Please try again.";
            
            setData({
                ...data,
                error: errorMessage,
                loading: false
            })
        }
    }
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Sign up to get started</p>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {data.error && (
                        <div className="error-message">
                            {data.error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input 
                            id="name" 
                            type="text" 
                            name="name"
                            value={data.name}
                            onChange={handleChange}
                            autoComplete="name"
                            placeholder="Enter your full name"
                            disabled={data.loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email" 
                            type="email" 
                            name="email"
                            value={data.email}
                            onChange={handleChange}
                            autoComplete="email"
                            placeholder="Enter your email"
                            disabled={data.loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="pass">Password</label>
                        <input 
                            id="pass" 
                            type="password" 
                            name="password"
                            value={data.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            placeholder="Enter your password (min 6 characters)"
                            disabled={data.loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select 
                            id="role" 
                            name="role"
                            value={data.role}
                            onChange={handleChange}
                            disabled={data.loading}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={data.loading}
                    >
                        {data.loading ? "Signing up..." : "Register"}
                    </button>
                </form>
                <div className="auth-footer">
                    <p>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register
