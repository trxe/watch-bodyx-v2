const registerRouting = (app) => {
    app.get('/', (req, res) => res.send('Hello World'));
}

export default registerRouting;