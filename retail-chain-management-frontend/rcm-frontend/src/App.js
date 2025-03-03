import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AddProductComponent from './components/warehouses/addProduct';
import ProductManagementComponent from './components/warehouses/listProduct';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/addproduct' element= {<AddProductComponent/>} />
          <Route path='/productmanage' element= {<ProductManagementComponent/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
