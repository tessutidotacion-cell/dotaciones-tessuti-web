import React from "react"
import SizeStockInput from "./SizeStockInput"

export default function StockRow({product,stock,onChange}){

return(

<tr>

<td>{product.name}</td>

{product.sizes.map(s=>(
<td key={s}>
<SizeStockInput
value={stock?.[s]}
onChange={v=>onChange(product.id,s,v)}
/>
</td>
))}

</tr>

)

}