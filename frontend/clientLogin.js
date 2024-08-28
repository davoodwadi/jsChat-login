// const urlBase = 'https://chat.intelchain.io'
// const urlBase = 'http://127.0.0.1:3000'
const loginUrl = '/users'



export async function signupUser(username, password){
    const res = await fetch('/users/signup', {
        method: 'POST',
        body: JSON.stringify({
            username: username,
            password: password,
        }), 
        headers: { 'Content-Type': 'application/json' }, 
    })
    
    if (res.ok) {
        const responseData = await res.json();
        return responseData
    } else {
        console.error('Error:', res.status, res.statusText);
    }
}

export async function loginUser(username, password){
    const res = await fetch('/users/login', {
        method: 'POST',
        body: JSON.stringify({
            username: username,
            password: password,
        }), 
        headers: { 'Content-Type': 'application/json' }, 
    })
    
    if (res.ok) {
        const responseData = await res.json();
        
        return responseData
    } else {
        console.error('Error:', res.status, res.statusText);
    }
}

export async function getProfile(){
    const res = await fetch('/users/profile', {
        method: 'GET',
    })
    // console.log(await res.json())
    if (res.ok) {
        const responseData = await res.json();
        return responseData
    } else {
        console.log('no profile found')
        return undefined
        // console.error('Error:', res.status, res.statusText);
    }
}
   
export async function logoutUser(){
    const res = await fetch('/users/logout', {
        method: 'GET',
    })
    if (res.ok) {
        const responseData = await res.json();
        
        return responseData
    } else {
        console.error('Error:', res.status, res.statusText);
    }
}
    
export async function testSession(){
    const res = await fetch('/test-session', {
        method: 'GET',
    })
    if (res.ok) {
        const responseData = await res.json();
        
        return responseData
    } else {
        console.error('Error:', res.status, res.statusText);
    }
}

export async function saveSession(saveContainer){
    const res = await fetch('/users/save', {
        method: 'POST',
        body: JSON.stringify({
            // username: username,
            // password: password,
            saveContainer: saveContainer,
        }), 
        headers: { 'Content-Type': 'application/json' }, 
    })
    
    if (res.ok) {
        const responseData = await res.json();
        
        return responseData
    } else {
        console.error('Error:', res.status, res.statusText);
    }
}

export async function loadLatestSession(){
    const res = await fetch('/users/load', {
        method: 'GET'
    })
    console.log(res.status) // 200 for success, 404 for 'not found'
    if (res.ok) {
        const responseData = await res.json();
        
        return responseData
    } else {
        console.error('Error:', res.status, res.statusText);
    }
}
