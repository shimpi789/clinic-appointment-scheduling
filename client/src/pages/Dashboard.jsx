import { useAuth } from "../context/useAuth";

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="app">
            <header className="app-header">
                <div>
                    <h1>Clinic Appointment Scheduling</h1>
                    <p>
                        Welcome, {user?.name}
                    </p>
                </div>

                <button type="button" onClick={logout}>
                    Logout
                </button>
            </header>

            <main className="app-main">
                <h2>Dashboard</h2>

                <p>
                    Role: <strong>{user?.role}</strong>
                </p>

                <p>
                    You are logged in successfully.
                </p>
            </main>
        </div>
    );
};

export default Dashboard;