import Router from "./routes/Router.jsx";
import Navbar from "./components/Layout/Navbar.jsx";
import "./app.css";
import { NotificationProvider } from "./state/NotificationContext.jsx";

export default function App() {
  return (
    <NotificationProvider>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Router />
        </main>
      </div>
    </NotificationProvider>
  );
}
