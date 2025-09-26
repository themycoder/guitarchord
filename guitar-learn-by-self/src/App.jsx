// src/App.jsx
import AppRouter from "./router/AppRouter.jsx";
import { DarkModeProvider } from "./context/DarkModeContext.jsx";
const App = () => {
  return (
    <DarkModeProvider>
      <AppRouter />
    </DarkModeProvider>
  );};

export default App;
