import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import RecommendedGames from './pages/RecommendedGames.jsx';
import ContactPage from './pages/ContactPage.jsx';
import Navigation from './pages/Navigation.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Profile from'./pages/profile.jsx';


import './App.css'

function App() {

  return (
    <>
      <header>
        <h1>Game Suggestor
          <img  src="/android-chrome-512x512.png" alt="Favicon"/>
        </h1>
        <p>Browse through our curated list of top games based on your preferences.</p>
      </header>

      <Router>
        <Navigation />
        <main>
            <section>
                <Routes>
                    <Route path="/" element={<HomePage />}></Route>
                    <Route path="/recommendedGames"    element={<RecommendedGames />}></Route>
                    <Route path="/contactPage"         element={<ContactPage />}></Route>
                    <Route path="/loginPage"           element={<LoginPage />}></Route>
                    <Route path="/profile"             element={<Profile />}></Route>


                </Routes>
            </section>
        </main>
      </Router>

      <footer>
          <p>&copy; {new Date().getFullYear()} Alvaro Espinoza</p>
      </footer>
          

    </>
  )
}

export default App
