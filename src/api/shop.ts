export interface IProduct {
    id: number
    title: string  // 名称
    price: number  // 价格
    inventory: number  //库存
}

const _products: IProduct[] = [
    { id: 1, title: 'iPad 6 Mini', price: 1500.01, inventory: 2 },
    { id: 2, title: '小米12 Pro', price: 2500.52, inventory: 10 },
    { id: 3, title: 'IPhone 10', price: 3205.32, inventory: 5 },
]


export const getProducts = async () => {
    await wait(100)
    return _products;
}

export const buyProducts = async () => {
    await wait(100)
    return Math.random() > 0.5;
}


async function wait(delay: number) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}