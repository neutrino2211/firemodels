import * as tests from "./framework";
import {field, factory, masked, key, Model, ModelLink} from "../src";
import * as uuid from "uuid";
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyBsw-jkvayy4Pql3vdWhoDfWiU2-549WzQ",
    authDomain: "firemodels-112a3.firebaseapp.com",
    projectId: "firemodels-112a3",
    storageBucket: "firemodels-112a3.appspot.com",
    messagingSenderId: "402351281225",
    appId: "1:402351281225:web:dcf1e2b2ed0b96d5fedb98",
    measurementId: "G-K616PELL4C"
};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

class Post extends Model<Post> {
    constructor() {
        super(Post, "posts");
    }

    @factory(uuid.v4) @key @field postId: string;
    @field details: string;
}

class User extends Model<User> {
    constructor() {
        super(User, "users")
    }

    @factory(uuid.v4) @key @masked @field userId: string;
    @factory(uuid.v4) @field userId2: string;

    @Post.links() @field posts: Array<ModelLink<Post>> = [];

    get brief() {
        return this.userId.slice(0, 6);
    }

    makePost(details: string) {
        const post = new Post()
        post.details = details;
        post.store();

        this.posts.push(post.link())
    }
}


const BaseUser = User.forApp<User>(app);

const test = new tests.TestRunner();
const firetests = new tests.TestGroup();
let user: User = new BaseUser()
let userId = "";

const newUserTest = tests.createTest("New user", "Create new user", async () => {
    console.log(user.userId, user.brief, user.fields, user.maskedFields.userId2);
    userId = user.userId;
    await user.store()
    return user.userId != ""
})

const makePostTest = tests.createTest("Create Post", "Create a new post and store on the user model", async() => {
    user.makePost("Hello World!!!")
    await user.store()
    return true
})

const getPostsTest = tests.createTest("Get posts", "Get list of post from a model body", async() => {
    const user = await new BaseUser().from(userId)
    const post = user.posts[0]
    console.log(await post.fromFirestore())
    // console.log(user.posts)
    return user.posts.length > 0;
})

const deleteUsersTest = tests.createTest("Delete Users", " Delete users from DB", async () => {
    user.delete()
    // user.posts.forEach(async p => {
    //     const post = await p.fromFirestore()
    //     post.delete()
    // })
    return true
})

firetests
.add(newUserTest)
.add(makePostTest)
.add(getPostsTest)
.add(deleteUsersTest)

test.group(firetests).execute();