import { useState, useEffect, useRef } from "react";
import {
  onSnapshot,
  collection,
  doc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db, useUser } from "./safeFirestore";

export const normalizeName = (name, boy, girl) => {
  return (
    name.toUpperCase().replace(/[^A-Z0-9]/g, "_") +
    "-" +
    (boy ? "b" : "") +
    (girl ? "g" : "")
  );
};

export const getTimeStamp = () => {
  const now = new Date();
  return Math.floor(
    (now.getTime() + now.getTimezoneOffset() * 60 * 1000) / 1000,
  );
};

const useNames = () => {
  const { user } = useUser();
  const [names, setNames] = useState([]);
  const [likes, setLikes] = useState([]);
  const [showGirls, setShowGirls] = useState(true);
  const [showBoys, setShowBoys] = useState(true);
  const [sortOrder, setSortOrder] = useState({
    key: "recent", // alpha, likes, recent
    reverse: false,
  });

  const normalizedNames = names.map((name) =>
    normalizeName(name.name, name.boy || false, name.girl || false),
  );

  const likesByName = likes.reduce((acc, like) => {
    if (!acc[like.name]) acc[like.name] = 0;
    acc[like.name] += 1;
    return acc;
  }, {});

  const sortFn = (() => {
    let fn = (a, b) => b.timestamp - a.timestamp;

    if (sortOrder.key === "alpha") {
      fn = (a, b) => a.name.localeCompare(b.name);
    } else if (sortOrder.key === "likes") {
      fn = (a, b) => b.likes - a.likes;
    }

    if (sortOrder.reverse) {
      return (a, b) => fn(b, a);
    } else {
      return fn;
    }
  })();

  const namesWithLikes = names
    .filter((name) => {
      if (showGirls && showBoys) return true;
      if (showGirls) return name.girl;
      if (showBoys) return name.boy;
      return false;
    })
    .map((name) => ({
      ...name,
      likes:
        likesByName[
          normalizeName(name.name, name.boy || false, name.girl || false)
        ] || 0,
    }))
    .sort(sortFn);

  useEffect(() => {
    const unsubNames = onSnapshot(collection(db, "names"), (snapshot) => {
      setNames(snapshot.docs.map((doc) => doc.data()));
    });

    const unsubLikes = onSnapshot(collection(db, "likes"), (snapshot) => {
      setLikes(snapshot.docs.map((doc) => doc.data()));
    });

    return () => {
      unsubNames();
      unsubLikes();
    };
  }, []);

  const addName = (name, boy, girl) => {
    const normalized = normalizeName(name, boy, girl);
    if (normalizedNames.includes(normalized)) return false;

    const docRef = doc(db, "names", normalized);
    setDoc(docRef, {
      name,
      email: user?.email,
      timestamp: getTimeStamp(),
      boy: boy || false,
      girl: girl || false,
    });

    return true;
  };

  const likeName = (name, boy, girl) => {
    addDoc(collection(db, "likes"), {
      name: normalizeName(name, boy, girl),
      email: user?.email,
      timestamp: getTimeStamp(),
    });
  };

  return {
    namesWithLikes,
    sortOrder,
    showGirls,
    showBoys,
    addName,
    likeName,
    setSortOrder,
    setShowGirls,
    setShowBoys,
  };
};

export const Names = ({ goToPredictions }) => {
  const {
    namesWithLikes,
    sortOrder,
    showGirls,
    showBoys,
    addName,
    likeName,
    setSortOrder,
    setShowGirls,
    setShowBoys,
  } = useNames();
  const [newName, setNewName] = useState("");
  const [showSexModal, setShowSexModal] = useState(false);

  const handleSortChange = (e) => {
    setSortOrder({ ...sortOrder, key: e.target.value });
  };

  const handleReverseChange = (e) => {
    setSortOrder({ ...sortOrder, reverse: e.target.checked });
  };

  return (
    <div className="flex h-full max-h-full flex-col">
      {showSexModal && (
        <SexModal
          addName={(isBoy, isGirl) => {
            setShowSexModal(false);

            if (addName(newName, isBoy, isGirl)) {
              setNewName("");
            } else {
              alert("Name already exists!");
            }
          }}
        />
      )}
      <div className="m-4 mb-3 flex">
        <h1 className="grow text-5xl">Names</h1>
        <h1 className="cursor-pointer pl-2 text-5xl" onClick={goToPredictions}>
          {">"}
        </h1>
      </div>
      <div className="mx-4 mb-1">
        <p className="inline">Sort:</p>
        <select
          className="ml-2 mr-3 px-2 py-1"
          value={sortOrder.key}
          onChange={handleSortChange}
        >
          <option value="alpha">alphabetical</option>
          <option value="likes">likes</option>
          <option value="recent">most recent</option>
        </select>
        <input
          type="checkbox"
          id="reverse"
          value={sortOrder.reverse}
          onChange={handleReverseChange}
        />
        <label htmlFor="reverse" className="ml-1 mr-2 inline">
          reverse
        </label>
      </div>
      <div className="m-4 mt-0">
        <input
          defaultChecked
          type="checkbox"
          id="girls"
          value={showGirls}
          onChange={(e) => setShowGirls(e.target.checked)}
        />
        <label htmlFor="girls" className="ml-1 mr-2 inline">
          girls
        </label>
        <input
          defaultChecked
          type="checkbox"
          id="boys"
          value={showBoys}
          onChange={(e) => setShowBoys(e.target.checked)}
        />
        <label htmlFor="boys" className="ml-1 mr-2 inline">
          boys
        </label>
      </div>
      <div className="relative grow overflow-y-auto">
        <div className="absolute w-full">
          {namesWithLikes.map((data) => (
            <Name
              key={data.name}
              likeName={() => likeName(data.name, data.boy, data.girl)}
              {...data}
            />
          ))}
        </div>
      </div>
      <div className="relative mx-4 mb-2 mt-1 flex">
        <div className="absolute -top-5 w-full bg-gradient-to-t from-white pt-4" />
        <div className="mr-2 grow">
          <input
            className="border-md w-full rounded-md border-stone-200 p-2"
            type="text"
            placeholder="New suggestion"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="">
          <button
            onClick={() => setShowSexModal(true)}
            disabled={!newName}
            className={
              "border-md rounded-md p-2" +
              (!newName
                ? " bg-stone-200 text-slate-300"
                : " bg-green-400 hover:bg-green-500 hover:text-white")
            }
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const Name = ({ name, likes, likeName }) => {
  return (
    <div className="m-4 mt-0 flex items-center rounded-md border-2 border-stone-200">
      <div className="shrink-0 basis-16 px-4">
        <p>{likes}</p>
      </div>
      <div className="grow py-2 text-center">
        <h3 className="text-xl">{name}</h3>
      </div>
      <div
        className="shrink-0 basis-16 cursor-pointer px-4 text-right"
        onClick={likeName}
      >
        <p>+1</p>
      </div>
    </div>
  );
};

const SexModal = ({ addName }) => {
  const [isGirl, setIsGirl] = useState(false);
  const [isBoy, setIsBoy] = useState(false);
  const girlRef = useRef(null);
  const boyRef = useRef(null);

  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-white bg-opacity-50">
      <div className="flex w-full max-w-64 flex-col rounded-md bg-white p-4 shadow-lg">
        <div
          className={
            "mb-2 flex cursor-pointer items-center rounded-md border-4 bg-pink-300 p-4" +
            (isGirl ? " border-pink-500" : " border-pink-300")
          }
          onClick={() => {
            setIsGirl(!isGirl);
            girlRef.current.checked = !isGirl;
          }}
        >
          <input
            type="checkbox"
            value={isGirl}
            onChange={(e) => setIsGirl(e.target.checked)}
            ref={girlRef}
          />
          <p className="ml-2 mr-2 inline text-2xl">Girl</p>
        </div>
        <div
          className={
            "flex cursor-pointer items-center rounded-md border-4 bg-blue-300 p-4" +
            (isBoy ? " border-blue-500" : " border-blue-300")
          }
          onClick={() => {
            setIsBoy(!isBoy);
            boyRef.current.checked = !isBoy;
          }}
        >
          <input
            type="checkbox"
            value={isBoy}
            onChange={(e) => setIsBoy(e.target.checked)}
            ref={boyRef}
          />
          <p className="ml-2 mr-2 inline text-2xl">Boy</p>
        </div>
        <button
          onClick={() => addName(isBoy, isGirl)}
          disabled={!isBoy && !isGirl}
          className={
            "border-md mt-4 self-center rounded-md p-2" +
            (!isBoy && !isGirl
              ? " bg-stone-200 text-slate-300"
              : " bg-green-400 hover:bg-green-500 hover:text-white")
          }
        >
          Confirm
        </button>
      </div>
    </div>
  );
};
