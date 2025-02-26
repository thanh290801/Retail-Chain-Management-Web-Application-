import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AddProductComponent from './components/addProduct';
import ProductManagementComponent from './components/listProduct';
import Main from './components/pos/main';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/addproduct' element= {<AddProductComponent/>} />
          <Route path='/productmanage' element= {<ProductManagementComponent/>} />
          <Route path='/pos' element= {<Main/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
