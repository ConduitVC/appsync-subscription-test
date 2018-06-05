import React, { Fragment } from 'react';
import gql from "graphql-tag";
import { compose, graphql } from "react-apollo";

const requestQuote =  gql`
	mutation requestQuote($quoteRequest: QuoteRequestInput!) {
    requestQuote(quoteRequest: $quoteRequest) {
      id
      amount
      commodity
      customerId
    }
  }
`;

const quoteRequests = gql`
	{
    quoteRequests {
      id
      commodity
      amount
      status
      quoteResponse {
        id
        ask
        expires
      }
    }
  }
`;

const quoteResponseSubscription = gql`
	subscription NewQuoteResponseSub {
    subscribeToQuoteResponse {
        id
        ask
        expires
        respondedToQuote {
          id
          amount
          commodity
        }
    }
  }
`;

const passOnResponse =  gql`
	mutation requestQuote($quoteRequest: QuoteRequestInput!) {
    requestQuote(quoteRequest: $quoteRequest) {
      id
      amount
      commodity
      customerId
    }
  }
`;

class Home extends React.Component {
  
  state = { }
  
  handleButtonClick = e => {
    e.preventDefault();
  }

  handleButtonClick = async e => {
    e.preventDefault();
    try {
      const quoteRequest = (await this.props.mutate({
        variables: {
          quoteRequest: {
            ...this.state,
          },
        },
      })).data.requestQuote;
    
      console.log(quoteRequest);

    } catch (error) {
      console.log(error);
    }
  }

  handleChange = e => {
    const { name: meta, value } = e.target;
    const [ name, scalarType ] = meta.split('.');
    
    this.setState({
      ...this.state,
      [name]: scalarType === 'Int'
        ? Number.parseFloat(value)
        : value
     })
  }

  handleAcceptQuoteResponse = quoteResponseId => async e => {
  }

  handlePassQuoteResponse = quoteResponseId => async e => {
  }

  componentDidMount() {
    this.subscription = this.props.subscribeToNewQuoteResponses();
  }

  componentWillUnmount() {
    this.subscription(); // NOTE removes the subscription
  }

  render() {
    const { data } = this.props;

    return (
      <div>
        <form>
          <div>
            <label>Commodity</label>
            <input name="commodity.String" onChange={this.handleChange} value={this.state.commodity || ''} />
          </div>
          <div>
            <label>Amount</label>
            <input name="amount.Int" onChange={this.handleChange} value={this.state.amount || ''} />
          </div>
          <button onClick={this.handleButtonClick}>Request Quote</button>
        </form>
        <ul>
          {data && data.quoteRequests && data.quoteRequests.map(quoteRequest => (
            <li key={quoteRequest.id}>
              <span>status:{quoteRequest.status}</span>
              <span>Commodity:{quoteRequest.commodity}</span>
              <span>[{quoteRequest.amount}]</span>
              {quoteRequest.quoteResponse && (
                <Fragment>
                  <span>[{quoteRequest.quoteResponse.ask}]</span>
                  <button onClick={this.handlePassQuoteResponse(quoteRequest.quoteResponse.id)}>Pass</button>
                  <button onClick={this.handleAcceptQuoteResponse(quoteRequest.quoteResponse.id)}>Accept</button>
                </Fragment>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default compose(
  graphql(quoteRequests, {
    options: {
      fetchPolicy: 'network-only',
    },
    props: props => ({
      ...props,
      subscribeToNewQuoteResponses: () =>
        props.data.subscribeToMore({
          document: quoteResponseSubscription,
          variables: {},
          updateQuery: (prev, { subscriptionData: { data, errors } }) => {
            if(errors || !data) return { ...prev };
        
            const newQuoteResponse = data.subscribeToQuoteResponse;

            const alreadyExists = prev.quoteRequests.find(
              item => item.id === newQuoteResponse.respondedToQuote.id
            );

            if (alreadyExists) {
              return {
                ...prev,
                quoteRequests: prev.quoteRequests.map(quoteRequest => {
                  if(quoteRequest.id != newQuoteResponse.respondedToQuote.id) {
                    return quoteRequest
                  } else {
                    return {
                      ...quoteRequest,
                      status: 'RespondedTo',
                      quoteResponse: { ...newQuoteResponse, respondedToQuote: undefined }
                    }
                  }
                })
              };
            }

           
            const newItem = {
              id: newQuoteResponse.respondedToQuote.id,
              commodity: newQuoteResponse.respondedToQuote.commodity,
              amount: newQuoteResponse.respondedToQuote.amount,
              quoteResponse: {
                id: newQuoteResponse.id,
                ask: newQuoteResponse.ask,
                expires: newQuoteResponse.expires,
              }
            } 
            return Object.assign( {}, prev,
              { quoteResponses: [ newItem, ...prev.quoteRequests ] }
            )
          }
        })
    }),
  }),
  graphql(requestQuote)
)(Home);
