import React from 'react'

const Card = ({ data: { title, price, plan }, function: buySubscription }) => {

  return (
    <div className='card'>
      <img src="https://media.istockphoto.com/id/1457433817/photo/group-of-healthy-food-for-flexitarian-diet.jpg?s=612x612&w=0&k=20&c=v48RE0ZNWpMZOlSp13KdF1yFDmidorO2pZTu2Idmd3M=" alt="image" />
      <h3>{title}</h3>
      <h4>{plan}</h4>
      <h4>{price}</h4>
      <button onClick={()=>buySubscription(title,plan)}>Subscribe Now</button>
    </div>
  )
}

export default Card
