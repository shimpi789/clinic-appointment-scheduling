import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import "./App.css";

const App = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthenticated ? (
                        <Navigate to="/" replace />
                    ) : (
                        <Login />
                    )
                }
            />

            <Route
                path="/"
                element={
                    isAuthenticated ? (
                        <Dashboard />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

<Route
    path="/appointments"
    element={
        isAuthenticated ? (
            <Appointments />
        ) : (
            <Navigate to="/login" replace />
        )
    }
/>
        </Routes>
    );
};

export default App;