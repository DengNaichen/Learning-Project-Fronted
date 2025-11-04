import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginPage from './components/LoginPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <LoginPage />
      </div>

      {/* Footer with logos and info */}
      {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white/60"> */}
      {/*   <div className="flex justify-center gap-6 mb-4"> */}
      {/*     <a href="https://vite.dev" target="_blank" className="hover:opacity-80 transition-opacity"> */}
      {/*       <img src={viteLogo} className="logo h-12" alt="Vite logo" /> */}
      {/*     </a> */}
      {/*     <a href="https://react.dev" target="_blank" className="hover:opacity-80 transition-opacity"> */}
      {/*       <img src={reactLogo} className="logo react h-12" alt="React logo" /> */}
      {/*     </a> */}
      {/*   </div> */}
      {/*   <p className="text-sm">Built with Vite + React</p> */}
      {/* </div> */}
    </div>
  )
}

export default App
