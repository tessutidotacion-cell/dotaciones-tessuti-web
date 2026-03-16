import React from "react"

export default function SizeStockInput({value,onChange}){

return(

<input
type="number"
value={value||0}
onChange={e=>onChange(Number(e.target.value))}
/>

)

}