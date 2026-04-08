
const isProd = () => {
    return ["https://sdola.inverse.finance", "https://sdola.inverse.finance"].includes(location.origin);
}

type GTagEvent = {
    action: string;
    params?: {
        category: string;
        label: string;
        value: number;
    }
};

export const gaEvent = ({ action, params }: GTagEvent) => {
    // if(!isProd()){
    //     return
    // }
    // window.gtag('event', action, params)
}