This is some feedback that I provided to SurrealDB that might be helpful for me to consider too.

---

Hello Lizzie & the SurrealDB team,

Thank you for reaching out. I would love to use SurrealDB for my startup because there are so many things that I love about SurrealDB, but I can't get past the query language. 

I can tell that a lot of work and effort has been put into SurrealQL, so please understand that I am not trying to trash it. However, it is very difficult to use with a graph database. The reason why is due to mapping. The book "The Design of Everyday Things" describes mapping in terms of designing things for humans to use. This might be an oversimplified definition of mapping, but I'll give it a try: Mapping is the relationship between a control and the thing being controlled. In the case of databases, the control is the query language and the thing being controlled is the data. 

In a graph database, my conceptual model of how the data is arranged is an image of nodes and edges. It doesn't matter if my conceptual model is accurate. What matters is that my conceptual model helps me remember and understand the mapping between the query language and the data -- i.e. how the query language controls the data. This mapping concept for a database might also include the data browser and the JSON data that are returned from a query. In other words, do the mappings between the data model (e.g. nodes and edges), query language (e.g. Cypher/GQL), data browser (e.g. Neo4j Browser), and query results all support my conceptual model of my database? If any of those parts does not align with my conceptual model of a graph database, then the database might not be very easy to use.

The Cypher/GQL query language does a great job of mapping how the query language relates to and controls the data because the queries use a form of ASCII art and it is easy to differentiate the parts of a query. In other words, you can look at a query and tell what is going on with little effort. I think that is brilliant! To be fair, I don't think GQL is so easy and intuitive when you start performing complex queries. I think GQL could be improved quite a bit still, but when compared to many other query languages GQL is still much simpler to understand.

Many graph databases have other shortcomings that I don't love, which is why I was checking out SurrealDB. But as I explained above, SurrealQL is a bit of a deal breaker for me.

I am happy to discuss these ideas further, if you want.

Thank you for your time!

Sam Earl
