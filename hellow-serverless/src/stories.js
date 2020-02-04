const mongoose = require('mongoose');
const Story = require('./models/Story');
const uri = "mongodb+srv://choi:<passwd>@cluster0-yfbtu.mongodb.net/test?retryWrites=true&w=majority"

let connection = null;
const connect = () => {
  return mongoose.connect(uri, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true }).then(
    conn => {
      connection = conn;
      return connection;
    })
};

const createResponse = (status, body) => ({
  statusCode: status,
  body: JSON.stringify(body)
});

// 스토리 만들기
exports.createStory = (event, ctx, cb) => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  console.log("body is",event.body);
  
  const { title, body } = JSON.parse(event.body);
  console.log("title is",title);
  console.log("body is",title);
  connect().then(
    () => {
      const story = new Story({ title, body });
      return story.save();
    }
  ).then(
    story => {
      console.log("story is",story);
      cb(null, createResponse(200, story));
    }
  ).catch(
    e => cb(e)
  );
};
// 여러개의 스토리 리스팅
exports.readStories = (event, ctx, cb) => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  connect().then(
    // 역순으로, 최대 20개 리스팅
    () => Story.find().sort({ _id: -1 }).limit(20).lean().exec()
  ).then(
    stories => cb(null, createResponse(200, stories))
  );
};

// 특정 스토리 읽기
exports.readStory = (event, ctx, cb) => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  connect().then(
    // 역순으로, 최대 20개 리스팅
    () => Story.findById(event.pathParameters.id).exec()
  ).then(
    story => {
      if (!story) {
        return cb(null, { statusCode: 404 });
      }
      cb(null, createResponse(200, story));
    }
  );
};

// 스토리 수정
exports.updateStory = (event, ctx, cb) => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  const update = JSON.parse(event.body);
  connect().then(
    // id 로 찾아서 업데이트
    () => Story.findOneAndUpdate({ _id: event.pathParameters.id }, update, { new: true }).exec()
  ).then(
    story => {
      if (!story) {
        return cb(null, { statusCode: 404 });
      }
      cb(null, createResponse(200, story));
    }
  );
};

// 스토리 삭제
exports.deleteStory = (event, ctx, cb) => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  connect().then(
    // 역순으로, 최대 20개 리스팅
    () => Story.remove({ _id: event.pathParameters.id }).exec()
  ).then(
    () => cb(null, createResponse(204, null))
  );
};

/*
callbackWaitsForEmptyEventLoop => default true 
false로 설정시 이벤트루프에 풀이 연결된 상태로 유지하게됨 => 상태유지가 가능하다 => 디비 연결을 유지할 수 있음 

sls deploy

curl -X POST https://zp8abz61z2.execute-api.ap-northeast-2.amazonaws.com/dev/stories -H 'cache-control: no-cache' -H 'content-type: application/json' -d '{
    "title": "제목2",
    "body": "이야기2"
}'

curl -X GET https://zp8abz61z2.execute-api.ap-northeast-2.amazonaws.com/dev/stories

 */


