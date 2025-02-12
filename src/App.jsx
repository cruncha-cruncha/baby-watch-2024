import { useState } from "react";
import { useUser } from "./safeFirestore";
import { Names } from "./Names";
import { Predictions } from "./Predictions";

function App() {
  const [screen, setScreen] = useState("names"); // ['names', 'predictions']

  const { isLoggedIn, login } = useUser();

  if (!isLoggedIn) {
    return (
      <div className="m-4 flex items-center">
        <h1 className="grow">BABY WATCH 2024</h1>
        <button
          className="border-md rounded-md bg-green-400 p-2 hover:bg-green-500 hover:text-white"
          onClick={login}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="h-dvh max-h-dvh">
      {screen === "names" && (
        <Names goToPredictions={() => setScreen("predictions")} />
      )}
      {screen === "predictions" && (
        <Predictions goToNames={() => setScreen("names")} />
      )}
    </div>
  );
}

export default App;
