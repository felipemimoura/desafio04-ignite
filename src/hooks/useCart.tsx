import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product} from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    //Buscar dados no LocalStorage 
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    //Verificar se existe dados no localstorege
    if (storagedCart) {
      //Caso possua dados transformar esses dados no formato original
      return JSON.parse(storagedCart);
    }

    //Caso não aja dados retorna um array vazio
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart] //Copia do cart
      const productExists = updatedCart.find(product => product.id === productId) //Verificado se o produto existe

      const stock = await api.get(`/stock/${productId}`) //Bucar a quantidade no estoque

      const stockAmount = stock.data.amount //Quantidade em estoque estoque do updateProductAmount
      const currentAmount = productExists ? productExists.amount : 0 //Quantidade que queremos
      const amount = currentAmount + 1

      //Verificações

    if(amount > stockAmount){
      //Se a quantidade solicitada é maior que que a quantidade em estoque
    
      toast.error('Quantidade solicitada fora de estoque');
      return
    }
    if(productExists){
      productExists.amount = amount;
    }else {
      const product = await api.get(`/products/${productId}`)

      const newProduct = {
        ...product.data,
        amount:1
      }
      updatedCart.push(newProduct)
    }

    setCart(updatedCart)

    localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      //Manter a imutabilidade do cart
      const updatedCart = [...cart]

      //Buscar se o ítem existe no carrinho
      const productExists = updatedCart.findIndex(product => product.id === productId)

      //Se existe o item, remove o item do CARRINHO
      if(productExists >= 0){
        updatedCart.splice(productExists, 1)
        setCart(updatedCart)

        //guarda os valores no localstorage
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else{
        //Se não existe mostra error
        throw new Error()
      }
    
     
    } catch {
      toast.error(toast.error('Erro na remoção do produto'))
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      //Verificar se o amout foi passado
      if(amount <= 0){
        return
      }

      //Pegar a quantidade de produtos no estoque estoque
      const stock = await api.get(`/stock/${productId}`)
      //encontrar a quantidade em estoque
      const stockAmount = stock.data.amount

      //Verificar se quantidade solicitada é menor que a quantidade em estoque

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      //Manter a imutabilidade do cart
      const updatedCart = [...cart];
      // Verificar se o produto existe no carrinho
      const productExists = updatedCart.find(product => product.id === productId)

      //se existe autualizar o estado e o local storage
      if(productExists){
        productExists.amount = amount
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else {
        throw new Error()
      }

    } catch {
      // Erro quando não há no estoque ou quantidae
      toast.error('Erro na alteração de quantidade do produto');

    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
