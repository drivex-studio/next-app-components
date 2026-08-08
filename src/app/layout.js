import React from 'react';
import ReactDOM from 'react-dom/client';
import PreloaderProvider from './contexts/PreloaderProvider';
import Preloader from './animations/general/pageLoader';

function App() {
  return React.createElement(
    PreloaderProvider,
    null,
    React.createElement(Preloader, null)
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
