const one = [
    {
      $group: {
        _id: "$rname",
        totalSales:{$sum:"$total"}
      }
    }
];

const two = [
  
    {
      $unwind: {
        path: "$products"
        }
    },
    {
      $group: {
        _id: "$products.productid",
        price:{$sum:"$products.price"},
        rname:{$first:"$rname"}
        
      }
    },{
      $sort:{price:-1}
    },{
      $limit:5
    }
  ]

const two2 = [
  
    {
      $unwind: {
        path: "$products"
        }
    },
    {
      $group: {
        _id: "$products.productid",
        count:{$count:{}},
        rname:{$first:"$rname"}
        
      }
    },{
      $sort:{count:-1}
    },{
      $limit:5
    }
  ]


  const three = [
  
    {
      $unwind: {
        path: "$products"
        }
    },
    {
      $group: {
        _id: "$userid",
        averageExpense:{$avg:"$total"}
      }
    }
  ]


  const four = [
  
    {
      $unwind: {
        path: "$products"
        }
    },
    {
      $addFields: {
        orderAt: {$dateToParts:{date:"$createdAt"}}
      }
    },
     {
        $group: {
          _id: "$orderAt.month",
          count:{$count:{}},
          totalExpense:{$sum:"$total"}
        }
      }
  ]

  const five = [
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "_id",
        as: "result"
      }
    },
    {
        $unwind: {
          path: "$products"
          }
      },
    {
      $unwind: {
        path: "$result",
      }
    },
    {
        $group: {
          _id: null,
          totalOrder: {
            $sum:"$result.total"
          },
          productId:{$push:"$products"},
        }
      }
    ,
    {
      $unwind: {
        path: "$productId",
      }
    },
      {
        $group: {
          _id: "$productId.productid",
          price:{$sum:"$productId.price"},
          total:{$first:"$totalOrder"},
          
        }
      },{
        $addFields: {
          contributed:{
            $divide:[{$multiply:["$price",100]},"$total"]
          }
        }
      }
  ]

  const eight = [
    {
      $addFields: {
        orderedDate:{$dateToParts:{date:"$createdAt"}}
      }
    }
    ,
    {
      $group: {
        _id: {month:"$orderedDate.month",year:"$orderedDate.year",day:"$orderedDate.day"},
        orderTotal:{$sum:"$total"},
      }
    },
    {
      $group: {
        _id: null,
        maximum:{$max:"$orderTotal"},
        date:{$first:"$_id"}
      }
    }
  ]

  const eight2 = [
    {
      $addFields: {
        startDateOfWeek: {$dateSubtract:{
          startDate:new Date(),
          unit:"week",
          amount:1
        }}
      }
    },
    {
      $match: {
        $expr: {
          "$and": [
            { "$gte": [ "$createdAt", "$startDateOfWeek" ] },
            { "$lte": [ "$createdAt", new Date() ] }
          ]
        }
      }
    },
    {
      $addFields: {
        orderedDate:{$dateToParts:{date:"$createdAt"}}
      }
    }
    ,
    {
      $group: {
        _id: {month:"$orderedDate.month",year:"$orderedDate.year",day:"$orderedDate.day"},
        orderTotal:{$sum:"$total"},
      }
    },
    {
      $group: {
        _id: null,
        maximum:{$max:"$orderTotal"},
        date:{$first:"$_id"}
      }
    }
  ]
//pipeline applied in products collection
  const fourteen = [

    {
      $lookup: {
        from: "products",
        localField: "products.productid",
        foreignField: "_id",
        as: "result"
      }
    },{
      $match:{
        result:{$exists:true,$eq:[]}
      }
    }
  ]