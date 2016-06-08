import React from 'react';
import {Link} from 'react-router';
import {finder} from '../utils';
import UserName from './user-name';
import {shorten} from 'ff-url-finder';
import {LINK, AT_LINK, LOCAL_LINK, EMAIL, HASHTAG, ARROW} from '../utils/link-types';
import config from '../config';

const searchConfig = config.search;
const MAX_URL_LENGTH = 50;

class Linkify extends React.Component {
  createLinkElement({type, username}, displayedLink, href) {
    let props = { key: `match${++this.idx}` };

    if (type == AT_LINK || type == LOCAL_LINK) {
      props['to'] = href;
      if (type == AT_LINK && this.userHover) {
        props['onMouseEnter'] = _ => this.userHover.hover(username);
        props['onMouseLeave'] = this.userHover.leave;
      };

      return React.createElement(
        Link,
        props,
        displayedLink
      );
    } else if (type == HASHTAG) {
      props['href'] = href;
      props['target'] = '_blank';

      return React.createElement(
        'a',
        props,
        displayedLink
      );
    } else if (type == ARROW) {
      props['className'] = 'arrow-span';
      props['onMouseEnter'] = _ => this.arrowHover.hover(displayedLink.length);
      props['onMouseLeave'] = this.arrowHover.leave;
      
      return React.createElement(
        'span',
        props,
        displayedLink
      );
    } else {
      props['href'] = href;
      props['target'] = '_blank';

      return React.createElement(
        'a',
        props,
        displayedLink
      );
    }
  }

  parseCounter = 0
  idx = 0

  parseString(string) {
    let elements = [];
    if (string === '') {
      return elements;
    }

    this.idx = 0;

    try {
      finder.parse(string).map(it => {
        let displayedLink = it.text;
        let href;

        if (it.type === LINK) {
          displayedLink = shorten(it.text, MAX_URL_LENGTH);
          href = it.url;
        } else if (it.type === AT_LINK) {
          elements.push(<UserName 
            user={{username: it.username}} 
            display={it.text} 
            userHover={this.userHover} 
            key={`match${++this.idx}`}/>);
          return;
        } else if (it.type === LOCAL_LINK) {
          displayedLink = shorten(it.text, MAX_URL_LENGTH);
          href = it.uri;
        } else if (it.type === EMAIL) {
          href = `mailto:${it.address}`;
        } else if (it.type === HASHTAG) {
          href = searchConfig.searchEngine+encodeURIComponent(it.text);
        } else if (it.type === ARROW && this.arrowHover) {
          // pass
        } else {
          elements.push(it.text);
          return;
        }

        let linkElement = this.createLinkElement(it, displayedLink, href);

        elements.push(linkElement);
      });

      return (elements.length === 1) ? elements[0] : elements;
    }
    catch (err) {
      console.log('Error while liknifying text', string, err);
    }
    return [string];
  }

  parse(children) {
    let parsed = children;

    if (typeof children === 'string') {
      parsed = this.parseString(children);
    } else if (React.isValidElement(children) && (children.type !== 'a') && (children.type !== 'button')) {
      parsed = React.cloneElement(
        children,
        {key: `parse${++this.parseCounter}`},
        this.parse(children.props.children)
      );
    } else if (children instanceof Array) {
      parsed = children.map(child => {
        return this.parse(child);
      });
    }

    return parsed;
  }

  render() {
    this.parseCounter = 0;
    this.userHover = this.props.userHover;
    this.arrowHover = this.props.arrowHover;
    const parsedChildren = this.parse(this.props.children);

    return <span className='Linkify'>{parsedChildren}</span>;
  }
}

export default Linkify;
