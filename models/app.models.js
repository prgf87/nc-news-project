const db = require("../db/connection");
const { readFile } = require("node:fs/promises");
const format = require("pg-format");
const fetchTopics = () => {
  return db.query(`SELECT * FROM topics`).then(({ rows }) => {
    return rows;
  });
};

const fetchEndPoints = () => {
  return readFile("endpoints.json", "utf-8").then((file) => {
    return file;
  });
};

const fetchArticleById = (id) => {
  return db
    .query(`SELECT * FROM articles WHERE article_id = $1`, [id])
    .then(({ rows }) => {
      const article = rows[0];
      if (!article) {
        return Promise.reject({ status: 404, msg: "Not found" });
      }
      return article;
    });
};

const fetchCommentsByArticleID = (id) => {
  return db
    .query(
      `
    SELECT * FROM comments 
    LEFT JOIN articles ON articles.article_id = comments.article_id
    WHERE articles.article_id = $1
    ORDER BY comments.created_at ASC
  `,
      [id]
    )
    .then(({ rows }) => {
      const result = rows;
      if (!result.length) {
        return Promise.reject({ status: 404, msg: "Not found" });
      }
      return rows;
    });
};
const fetchArticles = ({
  topic,
  sort_by = "created_at",
  order_by = "DESC",
}) => {
  const acceptedTopics = ["mitch", "cats", "paper"];
  const acceptedOrderBy = ["DESC", "ASC"];
  const acceptedSortBy = [
    "date",
    "article_id",
    "title",
    "topic",
    "author",
    "created_at",
    "votes",
    "body",
  ];

  let baseStr = `
  SELECT articles.*, COUNT(comments.article_id) AS comment_count 
  FROM articles
  LEFT JOIN comments 
  ON comments.article_id = articles.article_id `;

  if (!acceptedTopics.includes(topic) && topic !== undefined) {
    return Promise.reject({ status: 404, msg: "Not found" });
  } else if (acceptedTopics.includes(topic)) {
    baseStr += `    
    WHERE articles.topic = topic AND topic = '${topic}' `;
  }

  if (!acceptedSortBy.includes(sort_by)) {
    return Promise.reject({ status: 400, msg: "Bad request" });
  }

  if (!acceptedOrderBy.includes(order_by.toUpperCase())) {
    return Promise.reject({ status: 400, msg: "Bad request" });
  } else if (order_by) {
    order_by = order_by.toUpperCase();
  }

  baseStr += `    
    GROUP BY articles.article_id
    ORDER BY articles.${sort_by} ${order_by}
  `;

  const formattedString = format(baseStr);

  return db.query(formattedString).then(({ rows }) => {
    return rows;
  });
};

const updateArticle = (votes, id) => {
  const { inc_votes } = votes;
  return db
    .query(
      `
      UPDATE articles  
      SET
      votes = $1
      WHERE
      article_id = $2
      RETURNING *;
    `,
      [inc_votes, id]
    )
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({
          status: 404,
          msg: "Not found",
        });
      }
      return rows[0];
    });
};

const putNewComment = (newComment, id) => {
  const { username, body } = newComment;

  return db
    .query(
      `
        INSERT INTO comments(body, author, article_id)
        VALUES ($1, $2, $3)
        RETURNING *`,
      [body, username, id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

module.exports = {
  fetchEndPoints,
  fetchArticleById,
  fetchCommentsByArticleID,
  fetchTopics,
  fetchEndPoints,
  fetchArticles,
  fetchArticleById,
  updateArticle,
  putNewComment,
};
