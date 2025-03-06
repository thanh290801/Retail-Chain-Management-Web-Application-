import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AddProductComponent from './components/addProduct';
import ProductManagementComponent from './components/listProduct';

import Header from './headerComponent/header';
import LoginPage from './components/login';
import Main from './components/pos/Main';


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/addproduct' element= {<AddProductComponent/>} />
          <Route path='/productmanage' element= {<ProductManagementComponent/>} />
          <Route path='/header' element= {<Header/>} />
          <Route path='/login' element= {<LoginPage/>} />
          <Route path='/pos' element= {<Main/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
