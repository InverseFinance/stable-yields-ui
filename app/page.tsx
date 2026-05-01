import { Metadata } from "next";
import YieldsPage from "./stable-yields/page";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.stableyields.info/stable-yields",
  },
};

export const revalidate = 300;

export default YieldsPage;