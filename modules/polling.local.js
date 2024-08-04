class PollingLocal {
  constructor(port, interval) {
    this.endpoint = 'http://localhost:' + port;
    this.interval = interval;
    setInterval(() => {
      this.get();
    }, this.interval);
  }

  get() {
    fetch(this.endpoint + '/get').then((response) => {
      let json = response.json();
    });
  }

  async set(value) {
    const rawResponse = await fetch(this.endpoint + '/set', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: value })
    });

    const content = await rawResponse.json();

    console.log(content);
  }
}

export default PollingLocal;
