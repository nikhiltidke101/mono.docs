import { redirect } from "next/navigation";
import React from "react";

const page = () => {
  redirect("/public");
};

export default page;
