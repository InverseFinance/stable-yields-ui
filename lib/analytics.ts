
const isProd = () => {
    return ["https://stableyields.info", "https://www.stableyields.info"].includes(location.origin);
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
    if(!isProd()){
        return
    }
    window.gtag('event', action, params)
}