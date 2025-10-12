import Router from "./routes/Router.jsx";
import Navbar from "./components/Layout/Navbar.jsx";
import "./app.css";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Router />
      </main>
    </div>
  );
}
