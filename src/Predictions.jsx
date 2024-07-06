import React, {
  useState,
  useEffect,
  useReducer,
  useLayoutEffect,
  createRef,
} from "react";
import {
  onSnapshot,
  collection,
  doc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db, useUser } from "./safeFirestore";
import { getTimeStamp } from "./getTimestamp";

const usePredictions = () => {
  const { user } = useUser();
  const [predictions, setPredictions] = useState([]);

  const formattedPredictions = predictions.map((prediction) => ({
    ...prediction,
    eyeColour: prediction["eye-colour"],
    deliveryDate: prediction["delivery-date"],
    lastModified: prediction["last-modified"],
  }));

  const myPrediction = formattedPredictions.find(
    (prediction) => prediction.email === user?.email,
  );

  useEffect(() => {
    const unsubPredictions = onSnapshot(
      collection(db, "predictions"),
      (snapshot) => {
        setPredictions(
          snapshot.docs
            .map((doc) => doc.data())
            .sort((a, b) => a.email.localeCompare(b.email)),
        );
      },
    );

    return () => {
      unsubPredictions();
    };
  }, []);

  const updatePrediction = ({ sex, weight, deliveryDate, eyeColour }) => {
    const docRef = doc(db, "predictions", user?.email);
    setDoc(docRef, {
      sex,
      weight,
      "delivery-date": deliveryDate,
      "eye-colour": eyeColour,
      email: user?.email,
      "last-modified": getTimeStamp(),
    });
  };

  return {
    predictions: formattedPredictions,
    myPrediction,
    updatePrediction,
  };
};

export const Predictions = ({ goToNames }) => {
  const { predictions, myPrediction, updatePrediction } = usePredictions();
  const [view, setView] = useState("all");

  return (
    <div className="flex h-dvh max-h-dvh flex-col">
      <div className="m-4 mb-3 flex">
        <h1 className="cursor-pointer pr-2 text-5xl" onClick={goToNames}>
          {"<"}
        </h1>
        <h1 className="grow text-right text-5xl">Predictions</h1>
      </div>
      <div className="mx-4 mb-1 flex justify-end">
        <input
          type="radio"
          name="view"
          value="all"
          id="all"
          checked={view === "all"}
          onChange={(e) => setView(e.target.value)}
        />
        <label htmlFor="all" className="ml-1 mr-2">
          All
        </label>
        <input
          type="radio"
          name="view"
          value="mine"
          id="mine"
          checked={view === "mine"}
          onChange={(e) => setView(e.target.value)}
        />
        <label htmlFor="mine" className="ml-1 mr-2">
          Mine
        </label>
      </div>
      <div className="relative grow overflow-y-auto">
        {view == "all" && (
          <div className="absolute w-full">
            <AnimatePredictionChanges>
              {predictions.map((prediction) => (
                <Guess
                  key={prediction.email}
                  ref={createRef()}
                  {...prediction}
                />
              ))}
            </AnimatePredictionChanges>
          </div>
        )}
        {view == "mine" && (
          <MyGuess {...myPrediction} updatePrediction={updatePrediction} />
        )}
      </div>
    </div>
  );
};

const Guess = React.forwardRef(
  ({ sex, weight, deliveryDate, eyeColour, email }, ref) => {
    return (
      <div
        ref={ref}
        className={
          "mx-4 mb-3 rounded-lg p-2 border-4" +
          (sex == "boy" ? " border-blue-300" : "") +
          (sex == "girl" ? " border-pink-300" : "") +
          (sex == "other" ? " border-purple-300" : "")
        }
      >
        <div className="flex">
          <div className="shrink-0 grow-0 basis-1/6">
            {sex.substring(0, 1).toUpperCase() + sex.substring(1)}
          </div>
          <div className="shrink-0 grow basis-auto">
            {weight.lbs} lb{weight.lbs > 1 ? "s" : ""}{" "}
            {weight.oz > 0 ? `${weight.oz} oz` : ""}
          </div>
          <div className="shrink-0 grow-0 basis-2/6 text-right">
            {deliveryDate}
          </div>
        </div>
        <div className="fiex-wrap flex">
          <div className="shrink-0 basis-auto">{eyeColour} eyes</div>
          <div className="shrink-0 grow basis-auto self-end text-right text-sm text-stone-500">
            {email}
          </div>
        </div>
      </div>
    );
  },
);

const AnimatePredictionChanges = ({ children }) => {
  useLayoutEffect(() => {
    React.Children.forEach(children, (child, i) => {
      const domNode = child.ref.current;
      requestAnimationFrame(() => {
        domNode.style.transform = "rotateY(180deg)";
        domNode.style.transition = "transform 0s 0s";
        requestAnimationFrame(() => {
          domNode.style.transform = "";
          domNode.style.transition = `transform 400ms ${i * 50}ms`;
        });
      });
    });
  }, [children]);

  return children;
};

const myGuessReducer = (state, action) => {
  return { ...state, [action.type]: action.value };
};

const MyGuess = ({
  sex: oldSex = "girl",
  weight: oldWeight = { lbs: 0, oz: 0 },
  deliveryDate: oldDeliveryDate = "2024-11-06",
  eyeColour: oldEyeColour = "",
  updatePrediction,
}) => {
  const [state, dispatch] = useReducer(myGuessReducer, {
    sex: oldSex,
    weight: oldWeight,
    deliveryDate: oldDeliveryDate,
    eyeColour: oldEyeColour,
  });

  const handleChange = (action) => {
    dispatch(action);
    updatePrediction({ ...state, [action.type]: action.value });
  };

  return (
    <div className="mx-4 mt-2 flex flex-col items-center">
      <div className="mb-4">
        <select
          className="px-2 py-1"
          value={state.sex}
          onChange={(e) => handleChange({ type: "sex", value: e.target.value })}
        >
          <option value="girl">Girl</option>
          <option value="boy">Boy</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="mb-4">
        <input
          type="number"
          id="lbs"
          className="w-24 px-2 py-1"
          value={state.weight.lbs}
          onChange={(e) =>
            handleChange({
              type: "weight",
              value: { ...state.weight, lbs: e.target.value },
            })
          }
        />
        <label htmlFor="lbs" className="pl-1 pr-2">
          lbs
        </label>
        <input
          type="number"
          id="oz"
          className="w-24 px-2 py-1"
          value={state.weight.oz}
          onChange={(e) =>
            handleChange({
              type: "weight",
              value: { ...state.weight, oz: e.target.value },
            })
          }
        />
        <label htmlFor="oz" className="pl-1">
          oz
        </label>
      </div>
      <div className="mb-4 px-2 py-1">
        <label htmlFor="delivery-date" className="pr-2">
          Born
        </label>
        <input
          type="date"
          id="delivery-date"
          name="delivery-date"
          min="2024-08-01"
          max="2025-01-31"
          value={state.deliveryDate}
          onChange={(e) =>
            handleChange({ type: "deliveryDate", value: e.target.value })
          }
          className="px-2 py-1"
        />
      </div>
      <div>
        <input
          type="text"
          id="eye-colour"
          placeholder="colour"
          className="w-40 px-2 py-1"
          value={state.eyeColour}
          onChange={(e) =>
            handleChange({ type: "eyeColour", value: e.target.value })
          }
        />
        <label htmlFor="eye-colour" className="pl-2">
          eyes
        </label>
      </div>
    </div>
  );
};
