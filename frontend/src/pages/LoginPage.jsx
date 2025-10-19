import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const signUp = async () => {
        try {
            console.log("Frontend: Sending singup request to microserviceD...");
            const response = await fetch("http://localhost:3001/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                console.log("Frontend: Received signup confirmation from microserviceD.");
                const users = JSON.parse(localStorage.getItem("users")) || {};
    
                users[username] = { password, likedGames: [] };
    
                localStorage.setItem("users", JSON.stringify(users));
    
                alert(data.message); 
            } else {
                alert(data.error); 
            }
        } catch (error) {
            console.error("Error signing up:", error);
            alert("Signup failed. Please try again.");
        }
    };

    const login = async () => {
        try {
            const response = await fetch("http://localhost:3001/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                const users = JSON.parse(localStorage.getItem("users")) || {};
    
                if (users[username] && users[username].password === password) {
                    console.log("Login successful, storing user data...");
    
                    localStorage.setItem("currentUser", username);
                    localStorage.setItem("user/likedGames", JSON.stringify(users[username].likedGames));
    
                    alert("Login successful!");
                    navigate("/");
                } else {
                    alert("Invalid username or password.");
                }
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Login failed. Please try again.");
        }
    };    

    return (
        <>
            <h2>Login</h2>
            <section>
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="loginContainer">
                        <div className="inputs">
                            <div className="inputGroup">
                                <label htmlFor="userName"><b>Username:</b></label>
                                <input
                                    type="text"
                                    placeholder="Enter Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="inputGroup">
                                <label htmlFor="password"><b>Password:</b></label>
                                <input
                                    type="password"
                                    placeholder="Enter Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <label>
                            <input type="checkbox" name="remember"/> Remember me
                        </label>

                        <div className="buttonsGroup">
                            <button type="button" onClick={login}>Login</button>
                            <button type="button" onClick={signUp}>Signup</button>
                        </div>
                    </div>
                </form>
            </section>
        </>
    );
}

export default LoginPage;
