const app = require('../app');
const request = require('supertest');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const data = require('../db/data/test-data/');

const endpointsFile = require('../endpoints.json');

beforeEach(() => {
  return seed(data);
});

afterAll(() => {
  return db.end();
});

describe('app()', () => {
  describe('GET', () => {
    describe('/api', () => {
      it('200: responds with status 200', () => {
        return request(app).get('/api').expect(200);
      });
      it('200: should respond with a list of all available endpoints as a JSON object', () => {
        return request(app)
          .get('/api')
          .expect(200)
          .then(({ body }) => {
            expect(typeof body).toBe('object');
            Object.values(body).forEach((object) => {
              expect(object).toHaveProperty('description', expect.any(String));
              expect(object).toHaveProperty('queries', expect.any(Array));
              expect(object).toHaveProperty(
                'exampleResponse',
                expect.any(Object)
              );
            });
            expect(body).toEqual(endpointsFile);
          });
      });
    });
    describe('/api/topics', () => {
      it('200: return with a status of 200', () => {
        return request(app).get('/api/topics').expect(200);
      });

      it('200: return with a status of 200 and a body with all the results from the topics database', () => {
        return request(app)
          .get('/api/topics')
          .expect(200)
          .then(({ body }) => {
            const { topics } = body;
            expect(topics.length).toBe(3);
            topics.forEach((topic) => {
              expect(topic).toHaveProperty('slug', expect.any(String));
              expect(topic).toHaveProperty('description', expect.any(String));
            });
          });
      });
      it('404: returns with a 404 error when making a request to an api that does not exist', () => {
        return request(app).get('/api/toothpicks').expect(404);
      });
    });
    describe('GET /api/articles', () => {
      it('200: should receive status 200', () => {
        return request(app).get('/api/articles').expect(200);
      });
      it('200: should receive status 200 and a body with all the articles inside and a count of the comments for each of those articles', () => {
        return request(app)
          .get('/api/articles')
          .expect(200)
          .then(({ body }) => {
            const { articles } = body;
            expect(articles.length).toBe(13);
            expect(articles).toBeSortedBy('created_at', { descending: true });
            articles.forEach((article) => {
              expect(article).toHaveProperty('author', expect.any(String));
              expect(article).toHaveProperty('title', expect.any(String));
              expect(article).toHaveProperty('article_id', expect.any(Number));
              expect(article).toHaveProperty('topic', expect.any(String));
              expect(article).toHaveProperty('created_at', expect.any(String));
              expect(article).toHaveProperty('votes', expect.any(Number));
              expect(article).toHaveProperty(
                'article_img_url',
                expect.any(String)
              );
              expect(article).toHaveProperty(
                'comment_count',
                expect.any(String)
              );
            });
          });
      });
    });
    describe('/api/articles/:article_id', () => {
      it('200: return with a status of 200', () => {
        return request(app).get('/api/articles/1').expect(200);
      });
      it('200: return with a status of 200 and the corresponding article 1 data', () => {
        return request(app)
          .get('/api/articles/1')
          .expect(200)
          .then(({ body }) => {
            const { article } = body;
            expect(article).toHaveProperty('article_id', 1);
            expect(article).toHaveProperty('author', expect.any(String));
            expect(article).toHaveProperty('title', expect.any(String));
            expect(article).toHaveProperty('body', expect.any(String));
            expect(article).toHaveProperty('topic', expect.any(String));
            expect(article).toHaveProperty('created_at', expect.any(String));
            expect(article).toHaveProperty('votes', expect.any(Number));
            expect(article).toHaveProperty(
              'article_img_url',
              expect.any(String)
            );
          });
      });
      it('404: returns with a 404 error when making a request to an api that does not exist', () => {
        return request(app)
          .get('/api/toothpicks')
          .expect(404)
          .then(({ body }) => {
            const { msg } = body;
            expect(msg).toBe('Not found');
          });
      });
    });
    describe('/api/articles/:article_id/comments', () => {
      it('200: should return with a status of 200', () => {
        return request(app).get('/api/articles/1/comments').expect(200);
      });
      it('200: should return with an array of comments for the given article_id, with the correct properties and in the correct order', () => {
        return request(app)
          .get('/api/articles/1/comments')
          .expect(200)
          .then(({ body }) => {
            const { comments } = body;
            expect(comments.length).toBe(11);
            expect(comments).toBeSortedBy('created_at', { ascending: true });
            comments.forEach((comment) => {
              expect(comment).toHaveProperty('article_id', 1);
              expect(comment).toHaveProperty('comment_id', expect.any(Number));
              expect(comment).toHaveProperty('votes', expect.any(Number));
              expect(comment).toHaveProperty('created_at', expect.any(String));
              expect(comment).toHaveProperty('author', expect.any(String));
              expect(comment).toHaveProperty('body', expect.any(String));
            });
          });
      });
      it('400: should return a status 400 and a message of Bad request when a bad request is made', () => {
        return request(app)
          .get('/api/articles/hello/comments')
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).toBe('Bad request');
          });
      });
      it('404: should return a status 404 and a message of Not found when a bad request is made', () => {
        return request(app)
          .get('/api/articles/999/comments')
          .expect(404)
          .then(({ body }) => {
            expect(body.msg).toBe('Not found');
          });
      });
    });
  });
  xdescribe('POST', () => {
    describe('/api/articles/:article_id/comments', () => {
      it('201: should respond with status 201 and a body object containing the inserted comment inside the correct article (1)', () => {
        const newComment = {
          username: 'Keb84',
          body: 'Really great work on this ticket!',
        };
        return request(app)
          .post('/api/articles/1/comments')
          .send(newComment)
          .expect(201)
          .then(({ body }) => {
            const { comment } = body;
            expect(comment).toHaveProperty('username', expect.any(String));
            expect(comment).toHaveProperty('body', expect.any(String));
            expect(comment.body).toBe(newComment.body);
          });
      });
    });
  });
});
