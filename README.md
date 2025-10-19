# Ensure you have ZeroMQ installed.
You can install it via npm or another package manager suitable for your environment.

# Request
* Ensure you have installed ZeroMQ.
* To request data from the microservice there must be a JSON file.
* To make a request create a socket requesting ZeroMQ to communicate with the microservice. Send JSON file to the microservice which converts it to a CSV file. 

 try {
        const socket = new zmq.Request();
        await socket.connect("tcp://localhost:5555"); // Connect to the Python microservice

        await socket.send(JSON.stringify(json_data)); // Send data to microservice

        const [csv_data] = await socket.receive(); // Receive processed CSV data

        res.setHeader('Content-Disposition', 'attachment; filename=data.csv');
        res.set('Content-Type', 'text/csv');
        res.send(csv_data.toString());
    } catch (err) {
        res.status(500).send("Error processing request.");
    }