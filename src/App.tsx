import React, {useState} from 'react';
import './App.css';

const appInit: UI.App = {
    user: {
        test: "qqqq",
        id: localStorage.getItem("userId") || "",
        deviceId: localStorage.getItem("deviceId") || "",
        token: localStorage.getItem("token") || "",
        deviceSocketState: "connecting",
        deviceRTCState: "connecting",
    }
}
const AppContext = React.createContext<[UI.App, React.Dispatch<React.SetStateAction<UI.App>>]>([appInit, () => {
}])

function AppProvider(props: { children?: React.ReactNode }) {
    const [state, setState] = useState<UI.App>(appInit)
//wwda
    return (
        <AppContext.Provider value={[state, setState]}>
            {props.children}
        </AppContext.Provider>
    )
}

export {AppProvider, AppContext};
