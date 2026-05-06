
export default function OrderDetailModal({order,onClose}){

if(!order) return null

return(

<div className="modal">

<h3>Pedido {order.id}</h3>

<pre>{JSON.stringify(order,null,2)}</pre>

<button onClick={onClose}>Cerrar</button>

</div>

)

}