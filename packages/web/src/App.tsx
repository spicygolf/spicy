import spicyLogo from '/spicygolf.png';
import './App.css';
import Games from './components/Games';

function App() {

  return (
    <>
      <div>
        <a href="https://spicy.golf" target="_blank">
          <img src={spicyLogo} className="logo" alt="Spicy Golf logo" />
        </a>
      </div>
      <div className="card">
        <Games />
      </div>
    </>
  );
}

export default App;
