import React, { useEffect, useContext, createContext } from "react";
import useLocalStorage from './useLocalStorage'
import config from '../config'

//参考  https://usehooks.com/useAuth/

const authContext = createContext();

// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
export function ProvideAuth({ children }) {
    const auth = useProvideAuth();
    return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useAuth = () => {
    return useContext(authContext);
};

// Provider hook that creates auth object and handles state
function useProvideAuth() {
    const [user, setUser] = useLocalStorage('user', null);
    const [JWT, setJWT] = useLocalStorage('jwt', null);

    // Save the user to state.
    const signin = (email, password) => {
        return fetch(`${config.SOURCE.dataSource}/auth/local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: email,
                password
            })
        })
            .then(response => {
                if (response.ok)
                    return response.json();
                else
                    return response.json().then(errObj => {
                        throw Error(typeof (errObj.message) === 'string' ? errObj.message : errObj.message[0].messages[0].message);

                    })
            })
            .then(({ user: userObj, jwt }) => {
                setUser(userObj);
                setJWT(jwt);
                return true;
            })
        //.catch(error => console.error(error));

        /*
        setUser({
            "jwt": "eyJhbGciOiJIU.eyJpZCI6MSwiaWF0Ijox.UgsjjXkAZ",
            "user": {
                "id": 1,
                "username": "reader"
            }
        })
        */

    };

    const signup = (username, email, password, recaptchaToken) => {

        return fetch(`${config.SOURCE.dataSource}/auth/local/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username, email, password, recaptchaToken
            })
        })
            .then(response => {
                if (response.ok)
                    return response.json();
                else
                    return response.json().then(errObj => {
                        throw Error(typeof (errObj.message) === 'string' ? errObj.message : errObj.message[0].messages[0].message);
                    })
            })
            .then(({ user: userObj, jwt }) => {
                setUser(userObj);
                setJWT(jwt);
                return true;
            })
        //.catch(error => console.error(error));
    };

    const signout = () => {
        setUser(null);
        setJWT(null);
        return true;
    };

    const sendConfirmEmail = (email, recaptchaToken) => {
        return fetch(`${config.SOURCE.dataSource}/auth/send-email-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email, recaptchaToken
            })
        })
            .then(response => {
                if (response.ok)
                    return true;
                else
                    return response.json().then(errObj => {
                        throw Error(typeof (errObj.message) === 'string' ? errObj.message : errObj.message[0].messages[0].message);

                    })
            })

    };

    const sendPasswordResetEmail = (email, recaptchaToken) => {
        return fetch(`${config.SOURCE.dataSource}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email, recaptchaToken
            })
        })
            .then(response => {
                if (response.ok)
                    return true;
                else
                    return response.json().then(errObj => {
                        throw Error(typeof (errObj.message) === 'string' ? errObj.message : errObj.message[0].messages[0].message);

                    })
            })

        //.catch(error => console.error(error));

    };

    const confirmPasswordReset = (code, password, passwordConfirmation) => {
        return fetch(`${config.SOURCE.dataSource}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code, password, passwordConfirmation
            })
        })
            .then(response => {
                if (response.ok)
                    return true;
                else
                    return response.json().then(errObj => {
                        throw Error(typeof (errObj.message) === 'string' ? errObj.message : errObj.message[0].messages[0].message);

                    })
            })

        //.catch(error => console.error(error));


    };

    // 这里可以放置 更新 token 之类的操作
    useEffect(() => {
        if (JWT) {
            //如果通过当前 jwt没法获取用户信息
            (async () => {
                let response = null, ret = null;
                try {
                    response = await fetch(`${config.SOURCE.dataSource}/users/me`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${JWT}` }
                    })
                    ret = await response.json();
                    if (!response.ok)
                        throw (ret.message[0].messages[0].message);

                    setUser(ret);
                }

                catch (err) {
                    console.log(err);
                    setUser(null);
                    setJWT(null);
                }

            })();
        }
        // Cleanup subscription on unmount
        return () => {
        };
    }, []);

    // Return the user object and auth methods
    return {
        user,
        signin,
        signup,
        signout,
        sendConfirmEmail,
        sendPasswordResetEmail,
        confirmPasswordReset
    };
}