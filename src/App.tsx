import React, {useState} from 'react';
import './App.css';

const appInit: UI.App = {
    user: {
        test: "qqqq",
        id: localStorage.getItem("userId") || "qsz",
        deviceId: localStorage.getItem("deviceId") || "test-dev",
        token: localStorage.getItem("token") || "example",
        deviceSocketState: "online",
        deviceRTCState: "online",
    }
}
const AppContext = React.createContext<[UI.App, React.Dispatch<React.SetStateAction<UI.App>>]>([appInit, () => {
}])

function AppProvider(props: { children?: React.ReactNode }) {
    const [state, setState] = useState<UI.App>(appInit)

    return (
        <AppContext.Provider value={[state, setState]}>
            {props.children}
        </AppContext.Provider>
    )
}

export {AppProvider, AppContext};
